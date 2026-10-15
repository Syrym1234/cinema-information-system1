'use strict';
// ORDER BY бағыты міндетті түрде осы тізімнен таңдалады, еркін SQL мәтіні қабылданбайды.
const sortMap = {
  time_asc: 's.start_at ASC, s.session_id ASC',
  time_desc: 's.start_at DESC, s.session_id DESC',
  price_asc: 's.price ASC, s.start_at ASC, s.session_id ASC',
  price_desc: 's.price DESC, s.start_at ASC, s.session_id ASC',
  rating_desc: 'm.rating DESC, s.start_at ASC, s.session_id ASC'
};
function chooseSort(value) {
  return sortMap[value] || sortMap.time_asc;
}
module.exports = { chooseSort, sortMap };
